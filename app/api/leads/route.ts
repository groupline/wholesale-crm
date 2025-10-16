import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming form data
    const body = await request.json();

    // Validate required fields
    if (!body.fullName || !body.phone || !body.email || !body.address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Split full name into first and last name
    const nameParts = body.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    // 1. Create seller record
    const { data: seller, error: sellerError} = await supabase
      .from('sellers')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          phone: body.phone,
          email: body.email,
          status: 'new',
          lead_source: body.source || 'Website - Get Cash Offer',
          notes: body.notes || '',
        },
      ])
      .select()
      .single();

    if (sellerError) {
      console.error('Seller creation error:', sellerError);
      return NextResponse.json(
        { error: 'Failed to create seller record' },
        { status: 500 }
      );
    }

    // 2. Create property record linked to seller
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert([
        {
          seller_id: seller.id,
          address: body.address,
          city: body.city,
          state: body.state,
          zip: body.zipCode,
          bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
          bathrooms: body.bathrooms ? parseFloat(body.bathrooms) : null,
          year_built: body.yearBuilt ? parseInt(body.yearBuilt) : null,
          property_condition: body.condition,
          status: 'lead',
          notes: body.notes || '',
        },
      ])
      .select()
      .single();

    if (propertyError) {
      console.error('Property creation error:', propertyError);
      // Don't fail the whole request if property creation fails
    }

    // 3. Log activity
    const { error: activityError } = await supabase
      .from('activities')
      .insert([
        {
          activity_type: 'note',
          description: `New website lead: ${body.fullName} submitted cash offer request for ${body.address}`,
          related_to_type: 'seller',
          related_to_id: seller.id,
          created_by: 'Website Form',
        },
      ]);

    if (activityError) {
      console.error('Activity log error:', activityError);
      // Don't fail the whole request
    }

    // 4. Create a task for follow-up
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 1); // Tomorrow

    const { error: taskError } = await supabase
      .from('tasks')
      .insert([
        {
          title: `Follow up with ${body.fullName}`,
          description: `Website lead - Cash offer request for ${body.address}. Phone: ${body.phone}`,
          due_date: followUpDate.toISOString().split('T')[0],
          priority: 'high',
          status: 'pending',
          related_to_type: 'seller',
          related_to_id: seller.id,
          assigned_to: 'Sales Team',
        },
      ]);

    if (taskError) {
      console.error('Task creation error:', taskError);
      // Don't fail the whole request
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lead submitted successfully',
        data: {
          sellerId: seller.id,
          propertyId: property?.id,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
